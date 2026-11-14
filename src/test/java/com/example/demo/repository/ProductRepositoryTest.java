package com.example.demo.repository;

import com.example.demo.entity.Product;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;


@DataJpaTest
class ProductRepositoryTest {

    @Autowired
    private ProductRepository productRepository;


    private Product makeProduct(String name, double price) {
        Product p = new Product();
        p.setName(name);
        p.setDescription("desc");
        p.setPrice(price);
        return p;
    }

    @Test
    void save_assignsGeneratedId() {
        Product saved = productRepository.save(makeProduct("Laptop", 999.99));

        assertNotNull(saved.getId());
        assertEquals("Laptop", saved.getName());
    }

    @Test
    void findById_returnsProduct_whenExists() {
        Product saved = productRepository.save(makeProduct("Laptop", 999.99));

        Optional<Product> found = productRepository.findById(saved.getId());

        assertTrue(found.isPresent());
        assertEquals("Laptop", found.get().getName());
        assertEquals(999.99, found.get().getPrice());
    }

    @Test
    void findById_returnsEmpty_whenNotExists() {
        Optional<Product> found = productRepository.findById(9999L);

        assertTrue(found.isEmpty());
    }

    @Test
    void findAll_returnsAllSavedProducts() {
        productRepository.save(makeProduct("Laptop", 999.99));
        productRepository.save(makeProduct("Mouse", 19.99));

        List<Product> all = productRepository.findAll();

        assertEquals(2, all.size());
    }

    @Test
    void save_updatesExistingProduct_whenIdAlreadyExists() {
        Product saved = productRepository.save(makeProduct("Laptop", 999.99));

        saved.setName("Gaming Laptop");
        saved.setPrice(1499.99);
        productRepository.save(saved);

        Product reloaded = productRepository.findById(saved.getId()).get();
        assertEquals("Gaming Laptop", reloaded.getName());
        assertEquals(1499.99, reloaded.getPrice());
        assertEquals(1, productRepository.count());
    }

    @Test
    void delete_removesProduct() {
        Product saved = productRepository.save(makeProduct("Laptop", 999.99));

        productRepository.delete(saved);

        assertFalse(productRepository.findById(saved.getId()).isPresent());
        assertEquals(0, productRepository.count());
    }
}