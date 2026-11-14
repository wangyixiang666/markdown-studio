# 练习 4：只想修改新名单，原名单为什么也变了？
# 在 append 前后查看 original 和 updated，展开两个列表。

original = ["小林", "小周"]
updated = original
updated.append("小陈")

print("原名单：", original)
print("新名单：", updated)
print("两者是同一个列表吗？", original is updated)

assert len(original) == 2, "修改新名单不应该改变原名单"
