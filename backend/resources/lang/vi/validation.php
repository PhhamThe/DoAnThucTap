<?php

return [
    'required' => ':attribute không được để trống.',
    'min' => [
        'string' => ':attribute phải có ít nhất :min ký tự.',
        'numeric' => ':attribute phải lớn hơn hoặc bằng :min.',
        'array'  => ':attribute phải có ít nhất :min phần tử.',
    ],
    'max' => [
        'string' => ':attribute không được vượt quá :max ký tự.',
        'numeric' => ':attribute không được lớn hơn :max.',
        'array'  => ':attribute không được có nhiều hơn :max phần tử.',
    ],
    'unique' => ':attribute đã tồn tại.',
    'email' => ':attribute không đúng định dạng email.',
    'in' => ':attribute không hợp lệ.',
    'string' => ':attribute phải là chuỗi ký tự.',
    'integer' => ':attribute phải là số nguyên.',
    'date' => ':attribute không phải là ngày hợp lệ.',
    'boolean' => ':attribute phải là true hoặc false.',

    'attributes' => [
        'username' => 'Tên đăng nhập',
        'password' => 'Mật khẩu',
        'full_name' => 'Họ tên',
        'email' => 'Email',
        'role' => 'Vai trò',
        'name' => 'Tên',
        'description' => 'Mô tả',
        'subject_id' => 'Học phần',
        'teacher_id' => 'Giáo viên',
        'semester_id' => 'Kỳ học',
        'faculty_id' => 'Khoa viện',
        'code' => 'Mã môn học',
        'credit' => 'Số tín chỉ',
        'year' => 'Năm học',
        'start_date' => 'Ngày bắt đầu',
        'end_date' => 'Ngày kết thúc',
    ],

    'custom' => [
        'name' => [
            'unique' => 'Tên đã tồn tại.',
        ],
        'username' => [
            'unique' => 'Tên đăng nhập đã tồn tại.',
        ],
        'email' => [
            'unique' => 'Email đã tồn tại.',
        ],
        'code' => [
            'unique' => 'Mã môn học đã tồn tại.',
        ],
        'credit'=>[
            'integer'=>'Số tín chỉ phải là số nguyên'
        ]
    ],
];
