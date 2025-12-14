package com.example.researchreview.services.impl

import com.example.researchreview.entities.User
import com.example.researchreview.repositories.UserRepository
import com.example.researchreview.services.CurrentUserService
import com.example.researchreview.utils.SecurityUtils
import jakarta.persistence.EntityNotFoundException
import org.springframework.stereotype.Service

@Service
class CurrentUserServiceImpl(
    private val userRepository: UserRepository
) : CurrentUserService {

    override fun currentUser(): User? {
        val userId = SecurityUtils.currentUserId()
        if (userId.isBlank() || userId == "system") {
            return null
        }
        return userRepository.findByIdAndDeletedFalse(userId).orElse(null)
    }

    override fun requireUser(): User = currentUser() ?: throw EntityNotFoundException("Current user not found")
}
