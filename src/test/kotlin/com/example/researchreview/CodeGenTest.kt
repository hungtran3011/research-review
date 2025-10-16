package com.example.researchreview

import com.example.researchreview.utils.CodeGen
import org.junit.jupiter.api.Test

class CodeGenTest {

    @Test
    fun testCodeGen() {
        val codeGen = CodeGen()
        val code = codeGen.genCode()
        println(code)
        assert(code.length != 0);
    }
}