package com.example.researchreview.services

import com.example.researchreview.dtos.UserDto
import com.example.researchreview.dtos.UserRequestDto
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

interface UsersService {
    fun getAll(pageable: Pageable): Page<UserDto>;
    fun getById(id: String): UserDto;
    fun create(userDto: UserRequestDto): UserDto;
    fun update(id: String, userDto: UserRequestDto): UserDto;
    fun delete(id: String);
}