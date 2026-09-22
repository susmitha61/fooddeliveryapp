package com.fooddelivery.restaurantservice.service;

import com.fooddelivery.restaurantservice.dto.*;
import com.fooddelivery.restaurantservice.entity.Restaurant;
import org.springframework.data.domain.Page;
import java.util.List;

public interface RestaurantService {

    Page<RestaurantResponse> getAllRestaurants(int page, int size, String sortBy);
    Page<RestaurantResponse> getOpenNow(int page, int size);
    Page<RestaurantResponse> getNearby(String city, String area, int page, int size);
    List<RestaurantResponse> getTopRated(double minRating, int limit);
    Page<RestaurantResponse> filter(RestaurantFilterRequest filter);
    RestaurantResponse getById(String id);

    RestaurantResponse createRestaurant(String ownerId, RestaurantRequest req);
    List<RestaurantResponse> getByOwner(String ownerId);
    RestaurantResponse update(String id, String ownerId, RestaurantRequest req);
    RestaurantResponse toggleOpen(String id, String ownerId);

    RestaurantResponse changeStatus(String id, Restaurant.RestaurantStatus status);
    void deleteRestaurant(String id);
    void updateRating(String restaurantId, double newRating);

    RestaurantResponse assignManager(String id, String managerId, String callerId);
    RestaurantResponse unassignManager(String id, String managerId, String callerId);
}
