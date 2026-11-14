package com.example.demo;

import com.example.demo.repository.ProductRepository;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;


@SpringBootTest
@AutoConfigureMockMvc
class ProductIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ProductRepository productRepository;

    @BeforeEach
    void cleanDatabase() {
        productRepository.deleteAll();
    }


    private long createProductViaApi(String name, double price) throws Exception {
        String json = "{\"name\":\"" + name + "\",\"description\":\"desc\",\"price\":" + price + "}";

        MvcResult result = mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andReturn();

        Number id = JsonPath.read(result.getResponse().getContentAsString(), "$.id");
        return id.longValue();
    }

    @Test
    void createProduct_savesToDatabase() throws Exception {
        long id = createProductViaApi("Laptop", 999.99);

        assertEquals(1, productRepository.count());
        assertEquals("Laptop", productRepository.findById(id).get().getName());
    }

    @Test
    void getAllProducts_returnsCreatedProducts() throws Exception {
        createProductViaApi("Laptop", 999.99);
        createProductViaApi("Mouse", 19.99);

        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void getProductById_returnsProduct() throws Exception {
        long id = createProductViaApi("Laptop", 999.99);

        mockMvc.perform(get("/api/products/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Laptop"))
                .andExpect(jsonPath("$.price").value(999.99));
    }

    @Test
    void getProductById_returns404_whenMissing() throws Exception {
        mockMvc.perform(get("/api/products/99999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateProduct_changesDataInDatabase() throws Exception {
        long id = createProductViaApi("Laptop", 999.99);

        String json = "{\"name\":\"Gaming Laptop\",\"description\":\"new desc\",\"price\":1499.99}";

        mockMvc.perform(put("/api/products/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Gaming Laptop"));

        assertEquals("Gaming Laptop", productRepository.findById(id).get().getName());
        assertEquals(1, productRepository.count());    // updated, not duplicated
    }

    @Test
    void deleteProduct_removesFromDatabase() throws Exception {
        long id = createProductViaApi("Laptop", 999.99);

        mockMvc.perform(delete("/api/products/" + id))
                .andExpect(status().isNoContent());

        assertEquals(0, productRepository.count());
        mockMvc.perform(get("/api/products/" + id))
                .andExpect(status().isNotFound());
    }

    @Test
    void fullCrudFlow_createReadUpdateDelete() throws Exception {
        // CREATE
        long id = createProductViaApi("Laptop", 999.99);

        // READ
        mockMvc.perform(get("/api/products/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Laptop"));

        // UPDATE
        mockMvc.perform(put("/api/products/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Updated\",\"description\":\"d\",\"price\":1.5}"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/products/" + id))
                .andExpect(jsonPath("$.name").value("Updated"))
                .andExpect(jsonPath("$.price").value(1.5));

        // DELETE
        mockMvc.perform(delete("/api/products/" + id))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/products/" + id))
                .andExpect(status().isNotFound());
    }
}
