# 先独立调试，再对照这里的修改。运行本文件会检查五道练习。

def sum_to(n):
    total = 0
    for i in range(1, n + 1):
        total += i
    return total


def shipping_fee(amount):
    if amount >= 100:
        return 0
    return 8


def pay_after_coupon(total, coupon):
    return total - coupon


def checkout(price, count, coupon):
    subtotal = price * count
    return pay_after_coupon(subtotal, coupon)


assert sum_to(1) == 1
assert sum_to(5) == 15
assert [shipping_fee(x) for x in [99, 100, 101]] == [8, 0, 0]
assert checkout(12, 3, 5) == 31

original = ["小林", "小周"]
updated = original.copy()
updated.append("小陈")
assert original == ["小林", "小周"]
assert updated == ["小林", "小周", "小陈"]

scores = [78, 85, 92]
student_number = 3
index = student_number - 1
assert scores[index] == 92

print("五项练习全部通过。")
