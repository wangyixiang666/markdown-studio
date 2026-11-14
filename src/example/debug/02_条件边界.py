# 练习 2：规则是满 100 元免运费，100 元为什么还要运费？
# 在 if 这一行设断点，分别观察 99、100、101 三种情况。

def shipping_fee(amount):
    if amount > 100:
        return 0
    return 8


for price in [99, 100, 101]:
    fee = shipping_fee(price)
    print("商品金额：", price, "运费：", fee)

assert shipping_fee(100) == 0, "恰好 100 元也应该免运费"
