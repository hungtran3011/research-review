package com.example.researchreview.repositories

import com.example.researchreview.entities.User
import org.springframework.data.jpa.repository.JpaRepository

interface UserRepository: JpaRepository<User, String> {
}