# 练习 5：第三个同学的分数取不出来，是数据丢了吗？
# 保持“未捕获的异常”勾选，按 F5 运行到出错的位置。

scores = [78, 85, 92]
student_number = 3
index = student_number

print("列表长度：", len(scores))
third_score = scores[index]
print("第三位同学的分数：", third_score)

assert third_score == 92
