package com.fooddelivery.userservice.service;

import com.fooddelivery.userservice.client.RestaurantServiceClient;
import com.fooddelivery.userservice.dto.FavouriteRequest;
import com.fooddelivery.userservice.entity.*;
import com.fooddelivery.userservice.exception.ApiException;
import com.fooddelivery.userservice.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class FavouriteServiceImpl implements FavouriteService {

    private final FavouriteRepository favouriteRepository;
    private final UserProfileRepository profileRepository;
    private final RestaurantServiceClient restaurantServiceClient; // ← add this

    @Override
    public Favourite addFavourite(String userId, FavouriteRequest req) {

        // Validate restaurant exists in restaurant-service
        if (!restaurantServiceClient.restaurantExists(req.getRestaurantId()))
            throw new ApiException(
                    "Restaurant not found: " + req.getRestaurantId(),
                    HttpStatus.NOT_FOUND, "RESTAURANT_NOT_FOUND");

        if (favouriteRepository.existsByUserProfileIdAndRestaurantId(
                userId, req.getRestaurantId()))
            throw new ApiException("Restaurant already in favourites",
                    HttpStatus.CONFLICT, "ALREADY_FAVOURITE");

        UserProfile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new ApiException(
                        "Profile not found for userId: " + userId,
                        HttpStatus.NOT_FOUND, "PROFILE_NOT_FOUND"));

        Favourite fav = Favourite.builder()
                .userProfile(profile)
                .restaurantId(req.getRestaurantId())
                .restaurantName(req.getRestaurantName())
                .restaurantCuisine(req.getRestaurantCuisine())
                .build();

        log.info("Saving favourite for userId: {}", userId);
        return favouriteRepository.save(fav);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Favourite> getFavourites(String userId) {
        return favouriteRepository.findAllByUserProfileId(userId);
    }

    @Override
    public void removeFavourite(String userId, String restaurantId) {
        if (!favouriteRepository.existsByUserProfileIdAndRestaurantId(
                userId, restaurantId))
            throw new ApiException("Restaurant not in favourites",
                    HttpStatus.NOT_FOUND, "NOT_FAVOURITE");
        favouriteRepository.deleteByUserProfileIdAndRestaurantId(
                userId, restaurantId);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isFavourite(String userId, String restaurantId) {
        return favouriteRepository.existsByUserProfileIdAndRestaurantId(
                userId, restaurantId);
    }
}