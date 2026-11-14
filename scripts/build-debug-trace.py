"""Record the tutorial function with Python's real line and return events."""
import ast
import hashlib
import json
from pathlib import Path
import sys

root = Path(__file__).resolve().parents[1]
example = root / 'src/example/debug/01_循环边界.py'
text = example.read_text(encoding='utf-8')
function = next(node for node in ast.parse(text).body if isinstance(node, ast.FunctionDef) and node.name == 'sum_to')
original = ast.get_source_segment(text, function)
fixed = original.replace('range(1, n)', 'range(1, n + 1)')
assert original != fixed
result = {'provenance': {'source': str(example.relative_to(root)).replace('\\', '/'),
                         'sha256': hashlib.sha256(example.read_bytes()).hexdigest(),
                         'method': 'Python sys.settrace, sum_to(5), line events before execution'}}
for name, source in [('original', original), ('fixed', fixed)]:
    steps = []

    def trace(frame, event, value):
        if frame.f_code.co_filename == '<tutorial-sum>' and frame.f_code.co_name == 'sum_to':
            if event in {'line', 'return'}:
                row = {'event': event, 'line': frame.f_lineno,
                       'variables': {k: v for k, v in frame.f_locals.items() if k in {'n', 'i', 'total'}}}
                if event == 'return':
                    row['value'] = value
                steps.append(row)
        return trace

    namespace = {}
    exec(compile(source, '<tutorial-sum>', 'exec'), namespace)
    previous = sys.gettrace()
    try:
        sys.settrace(trace)
        value = namespace['sum_to'](5)
    finally:
        sys.settrace(previous)
    assert value == (10 if name == 'original' else 15)
    result[name] = {'source': source, 'steps': steps, 'result': value}
target = root / 'public/tutorial/trace.json'
target.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print({name: {'steps': len(result[name]['steps']), 'result': result[name]['result']} for name in ('original', 'fixed')})
