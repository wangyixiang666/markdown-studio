# 练习 3：买 3 本单价 12 元的书，用 5 元优惠券，应付多少？
# 在 checkout 中按 Alt+F11 进入函数，观察参数和调用堆栈。

def pay_after_coupon(total, coupon):
    payment = total - coupon
    return payment


def checkout(price, count, coupon):
    subtotal = price * count
    result = pay_after_coupon(coupon, subtotal)
    return result


answer = checkout(12, 3, 5)
print("应付金额：", answer)
assert answer == 31, "总价和优惠券金额是不是传反了？"
