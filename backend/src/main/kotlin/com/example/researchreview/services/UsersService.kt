package com.example.researchreview.services

import com.example.researchreview.constants.Role
import com.example.researchreview.dtos.AdminCreateUserRequestDto
import com.example.researchreview.dtos.UserDto
import com.example.researchreview.dtos.UserRequestDto
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

interface UsersService {
    fun getAll(pageable: Pageable): Page<UserDto>;
    fun getById(id: String): UserDto;
    fun getByEmail(email: String): UserDto?;
    fun search(
        name: String?,
        email: String?,
        institutionName: String?,
        role: String?,
        status: String?,
        pageable: Pageable
    ): Page<UserDto>
    fun create(userDto: UserRequestDto): UserDto;
    fun createByAdmin(dto: AdminCreateUserRequestDto): UserDto;
    fun update(id: String, userDto: UserRequestDto): UserDto;
    fun updateRole(id: String, role: String, performedBy: Role): UserDto;
    fun updateStatus(id: String, status: String): UserDto;
    fun delete(id: String);
}