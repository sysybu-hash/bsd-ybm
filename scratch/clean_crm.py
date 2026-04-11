import sys
import os

p = r'c:\Users\User\Desktop\BSD-YBM\app\dashboard\(protected)\crm\CrmClient.tsx'

with open(p, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Line 984 is index 983
# Line 1012 is index 1011
# We want to keep up to 983 (exclusive of index 983 which is line 984)
# And keep from index 1012 (which is line 1013)

new_lines = lines[:983] + lines[1012:]

with open(p, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Successfully cleaned CRM file.")
