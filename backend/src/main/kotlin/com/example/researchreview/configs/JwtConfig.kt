package com.example.researchreview.configs

import com.example.researchreview.utils.KeyUtils
import com.nimbusds.jose.jwk.JWKSet
import com.nimbusds.jose.jwk.RSAKey
import com.nimbusds.jose.jwk.source.ImmutableJWKSet
import com.nimbusds.jose.jwk.source.JWKSource
import com.nimbusds.jose.proc.SecurityContext
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.oauth2.jwt.JwtDecoder
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder
import org.springframework.security.oauth2.jwt.JwtEncoder
import java.security.interfaces.RSAPrivateKey
import java.security.interfaces.RSAPublicKey

@Configuration
class JwtConfig(
    @Value("\${custom.jwt-private-pem-key:}") private val privateKeyPem: String,
    @Value("\${custom.jwt-public-pem-key:}") private val publicKeyPem: String,
    @Value("\${jwt.key-id:}") private val keyId: String
) {

    @Bean
    fun jwtDecoder(): JwtDecoder {
        require(publicKeyPem.isNotBlank()) { "Property 'jwt.public-key-pem' must be set for RSA JWT decoding" }
        val pub = KeyUtils.publicKeyFromPem(publicKeyPem) as RSAPublicKey
        return NimbusJwtDecoder.withPublicKey(pub).build()
    }

    @Bean
    fun jwtEncoder(): JwtEncoder {
        require(privateKeyPem.isNotBlank() && publicKeyPem.isNotBlank()) { "Both jwt.private-key-pem and jwt.public-key-pem must be set for RSA JWT encoding" }
        val pub = KeyUtils.publicKeyFromPem(publicKeyPem) as RSAPublicKey
        val priv = KeyUtils.privateKeyFromPem(privateKeyPem) as RSAPrivateKey

        val rsaJwk = RSAKey.Builder(pub)
            .privateKey(priv)
            .keyID(if (keyId.isBlank()) null else keyId)
            .build()
        val jwkSet = JWKSet(rsaJwk)
        val jwkSource: JWKSource<SecurityContext> = ImmutableJWKSet(jwkSet)
        return NimbusJwtEncoder(jwkSource)
    }
}

