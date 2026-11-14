package com.example.demo.service;

import com.example.demo.entity.Product;
import com.example.demo.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private ProductService productService;

    private Product makeProduct(Long id, String name, double price){
        Product p = new Product();
        p.setId(id);
        p.setName(name);
        p.setDescription("descrip.....");
        p.setPrice(price);
        return p;
    }

    @Test
    void getAllProducts_returnList(){
        when(productRepository.findAll())
                .thenReturn(List.of(makeProduct(1L, "A", 10), makeProduct(2L, "B", 20)));

        List<Product> result = productService.getAllProducts();

        assertEquals(2, result.size());
    }

    @Test
    void getProducedById_returnsProduct_whenFound(){
        when(productRepository.findById(1L)).thenReturn(Optional.of(makeProduct(1L, "A", 10)));
        Optional<Product> result = productService.getProductById(1L);
        assertEquals("A", result.get().getName());
    }

    @Test
    void getProductById_returnEmpty_whenNotFound(){
        when(productRepository.findById(99L)).thenReturn(Optional.empty());
        Optional<Product> result = productService.getProductById(99L);

        assertTrue(result.isEmpty());
    }

    @Test
    void saveProduct_returnsSavedProduct(){
        Product product = makeProduct(1L, "A", 10);
        when(productRepository.save(product)).thenReturn(product);

        Product result = productService.saveProduct(product);

        assertEquals("A", result.getName());
        verify(productRepository).save(product);
    }

    @Test
    void updateProduct_changesFields_whenFound(){
        Product existing = makeProduct(1L, "Old", 10);
        Product newData = makeProduct(null, "New", 99);

        when(productRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(productRepository.save(existing)).thenReturn(existing);

        Product result = productService.updateProduct(1L, newData);

        assertEquals("New", result.getName());
        assertEquals(99, result.getPrice());
        assertEquals(1L, result.getId());
    }

    @Test
    void deleteProduct_deletes_whenFound(){
        Product existing = makeProduct(1L, "A", 10);
        when(productRepository.findById(1L)).thenReturn(Optional.of(existing));

        productService.deleteProduct(1L);

        verify(productRepository).delete(existing);
    }

    @Test
    void deleteProduct_throwsException_whenNotFound(){
        when(productRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> productService.deleteProduct(99L));
    }
}
