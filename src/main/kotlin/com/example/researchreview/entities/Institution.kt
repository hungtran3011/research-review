package com.example.researchreview.entities

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import lombok.AllArgsConstructor
import lombok.Data
import lombok.NoArgsConstructor
import lombok.NonNull
import java.util.UUID

@NoArgsConstructor
@AllArgsConstructor
@Data
@Entity
@Table(name = "institution")
class Institution {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    var id: UUID? = null;

    @Column(nullable = false)
    var name: String = "";
    var website: String = "";
    var logo: String = "";
    var country: String = "";
}