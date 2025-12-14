package com.example.researchreview.services

import com.example.researchreview.entities.User

interface CurrentUserService {
    fun currentUser(): User?
    fun requireUser(): User
}
