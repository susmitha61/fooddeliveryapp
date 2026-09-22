package com.fooddelivery.restaurantservice.repository;

import com.fooddelivery.restaurantservice.entity.MenuCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MenuCategoryRepository
        extends JpaRepository<MenuCategory, String> {

    List<MenuCategory> findByRestaurantIdAndIsActiveTrueOrderByDisplayOrderAsc(
            String restaurantId);
}