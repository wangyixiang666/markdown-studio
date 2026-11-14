"""Small DAP bridge over real CPython frames, running inside the worker."""
import ast
import json
import linecache
import os
import re
import sys
import traceback
import types


class DebugStop(BaseException):
    pass


class BrowserDebugger:
    def __init__(self, program, breakpoints, filters, stop_on_entry, no_debug):
        self.program = program
        self.breakpoints = breakpoints
        self.filters = filters
        self.mode = "entry" if stop_on_entry else "continue"
        self.anchor_depth = 0
        self.frames = []
        self.refs = {}
        self.next_ref = 1
        self.exception = None
        self.seen_exceptions = set()
        self.no_debug = no_debug
        self.hit_counts = {}

    def send(self, data):
        _debug_send(json.dumps(data, ensure_ascii=False))

    def event(self, event, body=None):
        self.send({"kind": "event", "event": event, "body": body or {}})

    def response(self, cmd, result=None, error=None):
        self.send({"kind": "response", "id": cmd["id"], "result": result or {},
                   "success": error is None, "error": error})

    @staticmethod
    def user_frame(frame):
        return frame.f_code.co_filename.startswith("/Markdown/")

    def stack(self, frame):
        frames = []
        while frame:
            if self.user_frame(frame):
                frames.append(frame)
            frame = frame.f_back
        return frames

    def add_ref(self, value, expression=None, frame=None, scope=False):
        ref = self.next_ref
        self.next_ref += 1
        self.refs[ref] = (value, expression, frame, scope)
        return ref

    def describe(self, name, value, expression=None, frame=None):
        try:
            rendered = repr(value)
        except Exception:
            rendered = "<无法显示>"
        expandable = isinstance(value, (dict, list, tuple, set)) or hasattr(value, "__dict__") and not isinstance(value, (types.ModuleType, type, types.FunctionType))
        result = {"name": str(name), "value": rendered[:800], "type": type(value).__name__,
                  "variablesReference": self.add_ref(value, expression, frame) if expandable else 0}
        if expression:
            result["evaluateName"] = expression
        return result

    def handle(self, cmd, frame=None):
        method, args = cmd["method"], cmd.get("args", {})
        try:
            if method == "setBreakpoints":
                verified = json.loads(verify_breakpoints(args["path"], json.dumps(args["breakpoints"])))
                self.breakpoints[args["path"]] = [bp for bp in verified if bp["verified"]]
                self.response(cmd, {"breakpoints": verified})
            elif method == "setExceptionBreakpoints":
                self.filters = args.get("filters", [])
                self.response(cmd)
            elif method == "stackTrace":
                frames = [{"id": i + 1, "name": f.f_code.co_name,
                           "source": {"name": os.path.basename(f.f_code.co_filename), "path": f.f_code.co_filename},
                           "line": f.f_lineno, "column": 1} for i, f in enumerate(self.frames)]
                start = args.get("startFrame", 0)
                self.response(cmd, {"stackFrames": frames[start:start + (args.get("levels") or len(frames))], "totalFrames": len(frames)})
            elif method == "scopes":
                target = self.frames[args["frameId"] - 1]
                self.response(cmd, {"scopes": [
                    {"name": "局部变量", "presentationHint": "locals", "expensive": False,
                     "variablesReference": self.add_ref(target.f_locals, frame=target, scope=True)},
                    {"name": "全局变量", "expensive": False,
                     "variablesReference": self.add_ref(target.f_globals, frame=target, scope=True)}]})
            elif method == "variables":
                value, expression, target, scope = self.refs[args["variablesReference"]]
                if isinstance(value, (list, tuple, set)):
                    items = [(str(i), v, f"{expression}[{i}]" if expression and not isinstance(value, set) else None) for i, v in enumerate(value)]
                elif isinstance(value, dict) or scope:
                    items = [(str(k), v, str(k) if scope else f"{expression}[{k!r}]" if expression else None)
                             for k, v in value.items() if not (scope and str(k).startswith("__"))]
                else:
                    items = [(str(k), v, f"{expression}.{k}" if expression else None) for k, v in vars(value).items()]
                start = args.get("start", 0)
                end = start + min(args.get("count") or 100, 100)
                self.response(cmd, {"variables": [self.describe(k, v, e, target) for k, v, e in items[start:end]]})
            elif method == "evaluate":
                target = self.frames[(args.get("frameId") or 1) - 1]
                expression = args.get("expression", "")
                try:
                    value = eval(expression, target.f_globals, target.f_locals)
                except SyntaxError:
                    if args.get("context") != "repl":
                        raise
                    exec(expression, target.f_globals, target.f_locals)
                    value = None
                info = self.describe("result", value, expression, target)
                self.response(cmd, {"result": info["value"], "type": info["type"], "variablesReference": info["variablesReference"]})
            elif method == "setVariable":
                value, expression, target, scope = self.refs[args["variablesReference"]]
                target = target or self.frames[0]
                replacement = eval(args["value"], target.f_globals, target.f_locals)
                name = args["name"]
                if isinstance(value, list):
                    value[int(name)] = replacement
                elif isinstance(value, dict) or scope:
                    key = name if scope else next((key for key in value if str(key) == name), name)
                    value[key] = replacement
                else:
                    setattr(value, name, replacement)
                info = self.describe(name, replacement, frame=target)
                self.response(cmd, {"value": info["value"], "type": info["type"], "variablesReference": info["variablesReference"]})
            elif method == "exceptionInfo":
                self.response(cmd, {"exceptionId": type(self.exception).__name__, "description": str(self.exception), "breakMode": "unhandled"})
            elif method in ("continue", "next", "stepIn", "stepOut"):
                self.mode = {"continue": "continue", "next": "next", "stepIn": "step", "stepOut": "out"}[method]
                self.anchor_depth = len(self.stack(frame))
                self.response(cmd, {"allThreadsContinued": True})
                self.event("continued", {"threadId": 1, "allThreadsContinued": True})
                return True
            elif method == "pause":
                self.mode = "pause"
                self.response(cmd)
            elif method in ("disconnect", "terminate"):
                self.response(cmd)
                raise DebugStop()
            else:
                self.response(cmd, error=f"暂不支持的调试请求：{method}")
        except Exception as error:
            self.response(cmd, error=f"{type(error).__name__}: {error}")
        return False

    def stop(self, frame, reason, text=None):
        self.frames = self.stack(frame)
        self.refs.clear()
        self.next_ref = 1
        body = {"reason": reason, "threadId": 1, "allThreadsStopped": True}
        if text:
            body["text"] = text
            body["description"] = text
        self.event("stopped", body)
        while True:
            cmd = json.loads(_debug_receive())
            if self.handle(cmd, frame):
                break

    def breakpoint_hit(self, frame):
        for bp in self.breakpoints.get(frame.f_code.co_filename, []):
            if bp["line"] != frame.f_lineno:
                continue
            key = (frame.f_code.co_filename, frame.f_lineno)
            self.hit_counts[key] = self.hit_counts.get(key, 0) + 1
            condition = bp.get("condition")
            try:
                if condition and not eval(condition, frame.f_globals, frame.f_locals):
                    continue
                hit = (bp.get("hitCondition") or "").strip()
                if hit:
                    count = self.hit_counts[key]
                    if hit.isdigit():
                        if count != int(hit):
                            continue
                    elif re.fullmatch(r"(?:>=|<=|==|>|<)\s*\d+", hit):
                        if not eval(f"{count}{hit}"):
                            continue
                    else:
                        raise ValueError("命中次数请输入整数，或 >=3 这样的条件")
                if bp.get("logMessage"):
                    message = re.sub(r"\{([^{}]+)\}", lambda m: str(eval(m[1], frame.f_globals, frame.f_locals)), bp["logMessage"])
                    self.event("output", {"category": "console", "output": message + "\n"})
                    continue
                return True
            except Exception as error:
                self.event("output", {"category": "stderr", "output": f"断点条件错误：{error}\n"})
                return True
        return False

    def trace(self, frame, event, arg):
        if not self.user_frame(frame):
            return None
        while _debug_poll():
            self.handle(json.loads(_debug_receive()), frame)
        if event == "exception" and "all" in self.filters and not isinstance(arg[1], (StopIteration, GeneratorExit)):
            self.exception = arg[1]
            if id(arg[1]) not in self.seen_exceptions:
                self.seen_exceptions.add(id(arg[1]))
                self.stop(frame, "exception", f"{arg[0].__name__}: {arg[1]}")
        if event == "line":
            depth = len(self.stack(frame))
            hit = self.breakpoint_hit(frame)
            stepping = self.mode in ("entry", "step", "pause") or self.mode == "next" and depth <= self.anchor_depth or self.mode == "out" and depth < self.anchor_depth
            if hit or stepping:
                reason = "breakpoint" if hit else "entry" if self.mode == "entry" else "pause" if self.mode == "pause" else "step"
                self.stop(frame, reason)
        return self.trace

    def run(self):
        exit_code = 0
        namespace = {"__name__": "__main__", "__file__": self.program}
        directory = os.path.dirname(self.program)
        os.chdir(directory)
        sys.path.insert(0, directory)
        try:
            with open(self.program, encoding="utf-8") as file:
                source = file.read()
            code = compile(source, self.program, "exec")
            linecache.cache[self.program] = (len(source), None, source.splitlines(True), self.program)
            if not self.no_debug:
                sys.settrace(self.trace)
            exec(code, namespace)
        except DebugStop:
            pass
        except BaseException as error:
            sys.settrace(None)
            exit_code = 1
            self.exception = error
            self.event("output", {"category": "stderr", "output": traceback.format_exc()})
            if not self.no_debug and "uncaught" in self.filters and id(error) not in self.seen_exceptions:
                tb = error.__traceback__
                last = None
                while tb:
                    if self.user_frame(tb.tb_frame):
                        last = tb.tb_frame
                    tb = tb.tb_next
                if last:
                    try:
                        self.stop(last, "exception", f"{type(error).__name__}: {error}")
                    except DebugStop:
                        pass
        finally:
            sys.settrace(None)
            self.event("exited", {"exitCode": exit_code})
            self.event("terminated")


def debug_entry(config_json):
    config = json.loads(config_json)
    BrowserDebugger(config["program"], config.get("breakpoints", {}), config.get("filters", ["uncaught"]),
                    config.get("stopOnEntry", True), config.get("noDebug", False)).run()


def verify_breakpoints(path, requested_json):
    try:
        with open(path, encoding="utf-8") as file:
            tree = ast.parse(file.read(), filename=path)
        lines = sorted({node.lineno for node in ast.walk(tree) if isinstance(node, ast.stmt)})
        result = []
        for requested in json.loads(requested_json):
            line = next((line for line in lines if line >= requested["line"]), None)
            result.append({**requested, "line": line or requested["line"], "verified": line is not None})
        return json.dumps(result)
    except Exception:
        return json.dumps([{**bp, "verified": False} for bp in json.loads(requested_json)])
