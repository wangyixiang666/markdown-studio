# 练习 1：为什么 1 + 2 + 3 + 4 + 5 没算对？
# 先按 F5，再反复按 F10，观察 i 和 total。

def sum_to(n):
    total = 0
    for i in range(1, n):
        total = total + i
    return total


number = 5
answer = sum_to(number)
print("计算结果：", answer)
print("期望结果：", 15)
assert answer == 15, "少加了哪个数？"
