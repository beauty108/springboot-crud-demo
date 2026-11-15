package com.example.demo;

import com.example.demo.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;


@SpringBootTest
@AutoConfigureMockMvc
class ProductValidationAndErrorTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ProductRepository productRepository;

    @BeforeEach
    void cleanDatabase() {
        productRepository.deleteAll();
    }



    @Test
    void createProduct_returns400_whenNameIsBlank() throws Exception {
        String json = "{\"name\":\"\",\"description\":\"desc\",\"price\":10.0}";

        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.errors.name").value("Name must not be blank"));

        assertEquals(0, productRepository.count());    // nothing was saved
    }

    @Test
    void createProduct_returns400_whenNameIsMissing() throws Exception {
        String json = "{\"description\":\"desc\",\"price\":10.0}";

        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.name").exists());
    }

    @Test
    void createProduct_returns400_whenPriceIsNegative() throws Exception {
        String json = "{\"name\":\"Laptop\",\"description\":\"desc\",\"price\":-5.0}";

        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.price").value("Price must not be negative"));
    }

    @Test
    void createProduct_returns400_withAllFieldErrors_whenSeveralFieldsAreInvalid() throws Exception {
        String json = "{\"name\":\"\",\"description\":\"desc\",\"price\":-5.0}";

        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.name").exists())
                .andExpect(jsonPath("$.errors.price").exists());
    }

    @Test
    void createProduct_returns400_whenJsonIsMalformed() throws Exception {
        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("this is not json"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createProduct_returns200_whenInputIsValid() throws Exception {
        String json = "{\"name\":\"Laptop\",\"description\":\"desc\",\"price\":999.99}";

        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Laptop"));
    }

    @Test
    void updateProduct_returns400_whenInputIsInvalid() throws Exception {
        String json = "{\"name\":\"\",\"description\":\"desc\",\"price\":10.0}";

        mockMvc.perform(put("/api/products/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.name").exists());
    }



    @Test
    void updateProduct_returns404_whenIdDoesNotExist() throws Exception {
        String json = "{\"name\":\"Laptop\",\"description\":\"desc\",\"price\":10.0}";

        mockMvc.perform(put("/api/products/99999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Product not found with id 99999"));
    }

    @Test
    void deleteProduct_returns404_whenIdDoesNotExist() throws Exception {
        mockMvc.perform(delete("/api/products/99999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Product not found with id 99999"));
    }
}
