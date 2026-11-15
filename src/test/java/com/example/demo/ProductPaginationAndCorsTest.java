package com.example.demo;

import com.example.demo.entity.Product;
import com.example.demo.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;


@SpringBootTest
@AutoConfigureMockMvc
class ProductPaginationAndCorsTest {

    private static final String ALLOWED_ORIGIN = "http://localhost:3000";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ProductRepository productRepository;

    @BeforeEach
    void insertFiveProducts() {
        productRepository.deleteAll();
        save("Apple", 5.0);
        save("Banana", 1.0);
        save("Cherry", 3.0);
        save("Date", 4.0);
        save("Elder", 2.0);
    }

    private void save(String name, double price) {
        Product p = new Product();
        p.setName(name);
        p.setDescription("desc");
        p.setPrice(price);
        productRepository.save(p);
    }



    @Test
    void getAll_withoutParams_returnsAllFiveOnOnePage() throws Exception {
        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Total-Count", "5"))
                .andExpect(header().string("X-Total-Pages", "1"))
                .andExpect(jsonPath("$.length()").value(5));
    }

    @Test
    void getAll_firstPageOfTwo() throws Exception {
        mockMvc.perform(get("/api/products?page=0&size=2"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Total-Count", "5"))
                .andExpect(header().string("X-Total-Pages", "3"))
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void getAll_lastPageHasRemainingItem() throws Exception {
        mockMvc.perform(get("/api/products?page=2&size=2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void getAll_pageBeyondTheEnd_returnsEmptyList() throws Exception {
        mockMvc.perform(get("/api/products?page=10&size=2"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Total-Count", "5"))
                .andExpect(jsonPath("$.length()").value(0));
    }



    @Test
    void getAll_sortByPriceAscending() throws Exception {
        mockMvc.perform(get("/api/products?sortBy=price&direction=asc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Banana"))
                .andExpect(jsonPath("$[4].name").value("Apple"));
    }

    @Test
    void getAll_sortByPriceDescending() throws Exception {
        mockMvc.perform(get("/api/products?sortBy=price&direction=desc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Apple"))
                .andExpect(jsonPath("$[4].name").value("Banana"));
    }

    @Test
    void getAll_sortByNameDescending() throws Exception {
        mockMvc.perform(get("/api/products?sortBy=name&direction=desc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Elder"));
    }



    @Test
    void getAll_returns400_forUnknownSortField() throws Exception {
        mockMvc.perform(get("/api/products?sortBy=password"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("sortBy must be one of: id, name, price"));
    }

    @Test
    void getAll_returns400_forSizeZero() throws Exception {
        mockMvc.perform(get("/api/products?size=0"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getAll_returns400_forNegativePage() throws Exception {
        mockMvc.perform(get("/api/products?page=-1"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getAll_returns400_forBadDirection() throws Exception {
        mockMvc.perform(get("/api/products?direction=sideways"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("direction must be asc or desc"));
    }



    @Test
    void cors_preflightFromAllowedOrigin_isAccepted() throws Exception {
        mockMvc.perform(options("/api/products")
                        .header("Origin", ALLOWED_ORIGIN)
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", ALLOWED_ORIGIN));
    }

    @Test
    void cors_preflightFromUnknownOrigin_isRejected() throws Exception {
        mockMvc.perform(options("/api/products")
                        .header("Origin", "http://evil.example.com")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isForbidden());
    }

    @Test
    void cors_actualRequestFromAllowedOrigin_exposesPaginationHeaders() throws Exception {
        mockMvc.perform(get("/api/products").header("Origin", ALLOWED_ORIGIN))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", ALLOWED_ORIGIN))
                .andExpect(header().string("Access-Control-Expose-Headers", containsString("X-Total-Count")));
    }
}
