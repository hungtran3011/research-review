package com.example.researchreview.services

import com.example.researchreview.constants.GlobalRole
import com.example.researchreview.dtos.AdminCreateUserRequestDto
import com.example.researchreview.dtos.UserDto
import com.example.researchreview.dtos.UserRequestDto
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

interface UsersService {
    fun getAll(pageable: Pageable, conferenceId: String? = null): Page<UserDto>;
    fun getById(id: String): UserDto;
    fun getByEmail(email: String): UserDto?;
    fun search(
        name: String?,
        email: String?,
        institutionName: String?,
        role: String?,
        status: String?,
        pageable: Pageable,
        conferenceId: String? = null
    ): Page<UserDto>
    fun create(userDto: UserRequestDto): UserDto;
    fun createByAdmin(dto: AdminCreateUserRequestDto): UserDto;
    fun update(id: String, userDto: UserRequestDto): UserDto;
    fun updateRole(id: String, role: String, performedBy: GlobalRole): UserDto;
    fun updateStatus(id: String, status: String): UserDto;
    fun delete(id: String);
}