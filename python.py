# PYTHON BASICS 

#  Variables and Data Types
print("I am Harshitha")
name = "harshitha"
age1 = 20
age2 = 20
print("My age next year:", age1 + 1)

if age1 == age2:
    print("Both ages are same")
else:
    print("Ages are not same")

print(type(name))  # str
print(type(age1))  # int

#  String operations
a = "hi"
b = "I am harshitha"
print(a + " " + b)
print(len(b))
print(b[0:14])
print(b[0:14:2])
print(b.endswith("a"))
print(a.capitalize())
b = b.replace("harshitha", "harshithav")
print(b)

#  Taking input
first = input("Enter your first name: ")
last = input("Enter your last name: ")
full = first + last
print("Full name:", full)
print("Length:", len(full))
print("Count $ symbol:", full.count("$"))

#  Conditions
a = int(input("Enter your age: "))
if a > 18:
    print("You are eligible to vote")
else:
    print("You are not eligible")

#  Number check & comparison
a = int(input("Enter first number: "))
b = int(input("Enter second number: "))
c = int(input("Enter third number: "))

if a % 7 == 0:
    print("Divisible by 7")
elif a == 0:
    print("Number is 0")
else:
    print("Not divisible by 7")

if a >= b and a >= c:
    print("a is greatest")
elif b >= a and b >= c:
    print("b is greatest")
else:
    print("c is greatest")

#  Lists
student = ["harshitha", 100, 19]
student[0] = "harshithav"
student.append("RVU")
student.insert(1, "btech")
student.pop(1)
print(student)

#  Palindrome check using list
a = [1, 2, 1]
b = a.copy()
b.reverse()
if a == b:
    print("List is a palindrome")
else:
    print("List is not a palindrome")

#  Tuples (immutable)
tuple1 = ("harshitha", 100, 19)
print(tuple1[0])
print(tuple1.count("harshitha"))
print(tuple1.index("harshitha"))

#  Dictionary
dict1 = {"name": "harshitha", "age": 19, "marks": 100}
dict1.update({"name": "harshithav"})
print(dict1["name"])

#  Sets
set1 = {1, 2, 3, 4, 5}
set1.add(6)
set1.remove(2)
print(set1)

# Set operations
a = {1, 2, 3}
b = {3, 4, 5}
print("Union:", a.union(b))
print("Intersection:", a.intersection(b))
print("Difference:", a.difference(b))

#  Dictionary Example (like a mini glossary)
pythondict1 = {
    "table": ["a thing", "a piece of furniture"],
    "cat": ["a small domesticated mammal"]
}
print(pythondict1["table"][0])

#  Loops
i = 1
while i <= 5:
    print("hi")
    i += 1

n = int(input("Enter a number: "))
for i in range(1, 11):
    print(f"{n} * {i} = {n*i}")

#  Functions
def greet(name):
    print("Hello", name)

greet("Harshitha")

def fact(a):
    i = a
    f = 1
    while i >= 1:
        f = f * i
        i = i - 1
    return f

print("Factorial of 5:", fact(5))

#  Recursion
def factorial(n):
    if n == 1:
        return 1
    return n * factorial(n - 1)

print("Recursive factorial:", factorial(5))

#  Sum of digits using recursion
def sum_of_digits(n):
    if n == 0:
        return 0
    return n+sum_of_digits(n-1)

print("Sum of digits in 123:", sum_of_digits(123))

#  Remove duplicates from list
def remove_duplicates(lst):
    result = []
    for item in lst:
        if item not in result:
            result.append(item)
    return result

print(remove_duplicates([1, 2, 2, 3, 1, 4]))

#  Rotate list right by k
def rotate_right(lst, k):
    return lst[-k:] + lst[:-k]

print("Rotated list:", rotate_right([1, 2, 3, 4, 5], 2))

#  Palindrome check (string)
def is_palindrome(s):
    return s == s[::-1]

print("Is 'madam' a palindrome?", is_palindrome("madam"))

#  Character frequency
def char_frequency(s):
    freq = {}
    for char in s:
        if char in freq:
            freq[char] += 1
        else:
            freq[char] = 1
    return freq

print("Character frequency in 'harshitha':", char_frequency("harshitha"))

#  Mood detection from sentence
text = "I feel really sad today"
if "sad" in text:
    mood = "Sad"
elif "happy" in text:
    mood = "Happy"
else:
    mood = "Neutral"
print("Mood detected:", mood)

#  Output-based trick questions
print([1, 2, 3] * 2)  # [1, 2, 3, 1, 2, 3]
print(type(5 / 2))    # <class 'float'>
print(5 == True)      # False
