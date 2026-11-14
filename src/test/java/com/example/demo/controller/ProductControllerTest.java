package com.example.demo.controller;

import com.example.demo.entity.Product;
import com.example.demo.service.ProductService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;


@WebMvcTest(ProductController.class)
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ProductService productService;

    private Product makeProduct(Long id, String name, double price) {
        Product p = new Product();
        p.setId(id);
        p.setName(name);
        p.setDescription("desc");
        p.setPrice(price);
        return p;
    }

    @Test
    void getAllProducts_returns200AndList() throws Exception {
        when(productService.getAllProducts())
                .thenReturn(List.of(makeProduct(1L, "Laptop", 999.99), makeProduct(2L, "Mouse", 19.99)));

        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].name").value("Laptop"))
                .andExpect(jsonPath("$[1].name").value("Mouse"));
    }

    @Test
    void getProductById_returns200_whenFound() throws Exception {
        when(productService.getProductById(1L)).thenReturn(Optional.of(makeProduct(1L, "Laptop", 999.99)));

        mockMvc.perform(get("/api/products/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Laptop"))
                .andExpect(jsonPath("$.price").value(999.99));
    }

    @Test
    void getProductById_returns404_whenNotFound() throws Exception {
        when(productService.getProductById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/products/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    void createProduct_returnsSavedProduct() throws Exception {
        when(productService.saveProduct(any(Product.class))).thenReturn(makeProduct(1L, "Laptop", 999.99));

        String json = "{\"name\":\"Laptop\",\"description\":\"desc\",\"price\":999.99}";

        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())          // article's controller returns 200 (not 201)
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Laptop"));
    }

    @Test
    void updateProduct_returnsUpdatedProduct() throws Exception {
        when(productService.updateProduct(eq(1L), any(Product.class)))
                .thenReturn(makeProduct(1L, "Gaming Laptop", 1499.99));

        String json = "{\"name\":\"Gaming Laptop\",\"description\":\"desc\",\"price\":1499.99}";

        mockMvc.perform(put("/api/products/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Gaming Laptop"))
                .andExpect(jsonPath("$.price").value(1499.99));
    }

    @Test
    void deleteProduct_returns204() throws Exception {
        mockMvc.perform(delete("/api/products/1"))
                .andExpect(status().isNoContent());

        verify(productService).deleteProduct(1L);
    }

    @Test
    void createProduct_returns400_whenJsonIsInvalid() throws Exception {
        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("this is not json"))
                .andExpect(status().isBadRequest());
    }
}