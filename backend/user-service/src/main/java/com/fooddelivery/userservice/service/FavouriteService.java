package com.fooddelivery.userservice.service;

import com.fooddelivery.userservice.dto.FavouriteRequest;
import com.fooddelivery.userservice.entity.Favourite;
import java.util.List;

public interface FavouriteService {
    Favourite addFavourite(String userId, FavouriteRequest request);
    List<Favourite> getFavourites(String userId);
    void removeFavourite(String userId, String restaurantId);
    boolean isFavourite(String userId, String restaurantId);
}