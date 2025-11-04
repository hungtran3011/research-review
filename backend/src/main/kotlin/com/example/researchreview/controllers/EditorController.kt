package com.example.researchreview.controllers

import com.example.researchreview.constants.EditorBusinessCode
import com.example.researchreview.dtos.BaseResponseDto
import com.example.researchreview.dtos.PageResponseDto
import com.example.researchreview.dtos.EditorDto
import com.example.researchreview.services.EditorService
import jakarta.validation.Valid
import org.springframework.data.domain.Pageable
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/editors")
class EditorController(
    private val editorService: EditorService
) {
    @PostMapping("/")
    fun create(@Valid @RequestBody editor: EditorDto): ResponseEntity<BaseResponseDto<EditorDto>> {
        val created = try {
            editorService.create(editor)
        } catch (e: Exception) {
            val response = BaseResponseDto(
                code = EditorBusinessCode.EDITOR_CREATED_FAIL.value,
                message = "Errors when creating editor: ${e.message}",
                data = EditorDto()
            )
            return ResponseEntity.status(422).body(response)
        }
        val response = BaseResponseDto(
            code = EditorBusinessCode.EDITOR_CREATED_SUCCESSFULLY.value,
            message = "Editor created successfully",
            data = created
        )
        return ResponseEntity.status(201).body(response)
    }

    @GetMapping("/")
    fun getAll(pageable: Pageable): ResponseEntity<BaseResponseDto<PageResponseDto<EditorDto>>> {
        val editors = editorService.getAll(pageable)
        val pageResponse = PageResponseDto.from(editors)
        val response = BaseResponseDto(
            code = EditorBusinessCode.EDITOR_FOUND.value,
            message = "Editors retrieved successfully",
            data = pageResponse
        )
        return ResponseEntity.ok(response)
    }

    @GetMapping("/{id}")
    fun get(@PathVariable id: String): EditorDto {
        return editorService.getById(id)
    }

    @PutMapping("/{id}")
    fun update(@PathVariable id: String, @RequestBody editor: EditorDto): EditorDto {
        // ensure the DTO id matches the path id
        if (editor.id.isBlank()) editor.id = id
        return editorService.update(editor)
    }

    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: String): ResponseEntity<Map<String, Boolean>> {
        editorService.delete(id)
        return ResponseEntity.ok(mapOf("success" to true))
    }
}
