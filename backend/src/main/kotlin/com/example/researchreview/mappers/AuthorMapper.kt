package com.example.researchreview.mappers

import com.example.researchreview.dtos.AuthorDto
import com.example.researchreview.dtos.InstitutionDto
import com.example.researchreview.entities.Author
import com.example.researchreview.entities.Institution
import com.example.researchreview.entities.User
import org.springframework.stereotype.Component

@Component
class AuthorMapper(
	private val userMapper: UserMapper
) {
	fun toDto(author: Author): AuthorDto {
		return AuthorDto(
			id = author.id,
			name = author.name,
			email = author.email,
			institution = toInstitutionDto(author.institution),
			user = author.user?.let { userMapper.toDto(it) },
			createdAt = author.createdAt,
			updatedAt = author.updatedAt,
			createdBy = author.createdBy,
			updatedBy = author.updatedBy
		)
	}

	fun apply(author: Author, dto: AuthorDto, institution: Institution, user: User?): Author {
		author.name = dto.name
		author.email = dto.email
		author.institution = institution
		author.user = user
		return author
	}

	private fun toInstitutionDto(institution: Institution): InstitutionDto {
		return InstitutionDto(
			id = institution.id,
			name = institution.name,
			country = institution.country,
			website = institution.website,
			logo = institution.logo
		)
	}
}
