package com.fooddelivery.userservice.repository;

import com.fooddelivery.userservice.entity.Favourite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface FavouriteRepository extends JpaRepository<Favourite, String> {

    List<Favourite> findAllByUserProfileId(String userId);

    Optional<Favourite> findByUserProfileIdAndRestaurantId(
            String userId, String restaurantId);

    boolean existsByUserProfileIdAndRestaurantId(
            String userId, String restaurantId);

    void deleteByUserProfileIdAndRestaurantId(
            String userId, String restaurantId);
}