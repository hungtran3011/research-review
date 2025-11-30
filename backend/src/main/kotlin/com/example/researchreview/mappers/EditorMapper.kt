package com.example.researchreview.mappers

import com.example.researchreview.dtos.EditorDto
import com.example.researchreview.entities.Editor
import org.mapstruct.Mapper
import org.mapstruct.Mapping
import org.mapstruct.Mappings

@Mapper(componentModel = "spring", uses = [UserMapper::class])
interface EditorMapper {

    @Mappings(
        value = [
            Mapping(target = "id", source = "id"),
            Mapping(target = "track", source = "track", qualifiedByName = ["trackToDto"]),
            Mapping(target = "user", source = "user")
        ]
    )
    fun toDto(editor: Editor): EditorDto
}
