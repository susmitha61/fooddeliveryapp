package com.fooddelivery.restaurantservice.service;

import com.fooddelivery.restaurantservice.dto.*;
import com.fooddelivery.restaurantservice.entity.Restaurant;
import com.fooddelivery.restaurantservice.exception.ApiException;
import com.fooddelivery.restaurantservice.repository.RestaurantRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class RestaurantServiceImpl implements RestaurantService {

    private final RestaurantRepository repo;

    @Autowired(required = false)
    private HttpServletRequest httpServletRequest;

    @Override
    @Transactional(readOnly = true)
    public Page<RestaurantResponse> getAllRestaurants(int page, int size, String sortBy) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "RATING".equalsIgnoreCase(sortBy) ? "rating" : "createdAt"));
        return repo.findByIsActiveTrueAndStatus(Restaurant.RestaurantStatus.ACTIVE, pageable).map(RestaurantResponse::from);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RestaurantResponse> getOpenNow(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return repo.findByIsActiveTrueAndIsOpenTrueAndStatus(Restaurant.RestaurantStatus.ACTIVE, pageable).map(RestaurantResponse::from);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RestaurantResponse> getNearby(String city, String area, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        if (area != null && !area.isBlank()) {
            return repo.findByAreaIgnoreCaseAndIsActiveTrueAndStatus(area, Restaurant.RestaurantStatus.ACTIVE, pageable).map(RestaurantResponse::from);
        }
        return repo.findByCityIgnoreCaseAndIsActiveTrueAndStatus(city, Restaurant.RestaurantStatus.ACTIVE, pageable).map(RestaurantResponse::from);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RestaurantResponse> getTopRated(double minRating, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return repo.findTopRated(minRating, pageable).stream().map(RestaurantResponse::from).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RestaurantResponse> filter(RestaurantFilterRequest f) {
        Pageable pageable = PageRequest.of(f.getPage(), f.getSize());
        return repo.findByFilters(f.getCity(), f.getArea(), f.getCuisineType(), f.getMealType(), f.getIsPureVeg(), f.getIsOpen(), f.getMinRating(), f.getKeyword(), pageable).map(RestaurantResponse::from);
    }

    @Override
    @Transactional(readOnly = true)
    public RestaurantResponse getById(String id) {
        Restaurant r = repo.findById(id).orElseThrow(() -> new ApiException("Restaurant not found", HttpStatus.NOT_FOUND, "RESTAURANT_NOT_FOUND"));
        return RestaurantResponse.from(r);
    }

    @Override
    public RestaurantResponse createRestaurant(String ownerId, RestaurantRequest req) {
        Restaurant r = Restaurant.builder()
                .ownerId(ownerId)
                .name(req.getName())
                .description(req.getDescription())
                .cuisineType(req.getCuisineType())
                .mealTypes(req.getMealTypes() != null ? req.getMealTypes() : Set.of("ALL_DAY"))
                .streetAddress(req.getStreetAddress())
                .area(req.getArea())
                .city(req.getCity())
                .state(req.getState())
                .pincode(req.getPincode())
                .phone(req.getPhone())
                .email(req.getEmail())
                .openingTime(parse(req.getOpeningTime()))
                .closingTime(parse(req.getClosingTime()))
                .deliveryFee(req.getDeliveryFee() != null ? req.getDeliveryFee() : 0.0)
                .minimumOrderAmount(req.getMinimumOrderAmount() != null ? req.getMinimumOrderAmount() : 0.0)
                .isPureVeg(req.getIsPureVeg() != null ? req.getIsPureVeg() : false)
                .imageUrl(req.getImageUrl())
                .status(Restaurant.RestaurantStatus.ACTIVE)
                .isOpen(true)
                .isActive(true)
                .build();
        Restaurant saved = repo.save(r);
        return RestaurantResponse.from(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RestaurantResponse> getByOwner(String ownerId) {
        String role = httpServletRequest != null ? httpServletRequest.getHeader("X-User-Role") : null;
        if (role != null && role.toUpperCase().contains("ADMIN")) {
            return repo.findByIsActiveTrueAndStatus(Restaurant.RestaurantStatus.ACTIVE, PageRequest.of(0, 100))
                    .stream().map(RestaurantResponse::from).collect(Collectors.toList());
        }
        return repo.findByOwnerIdOrManagerId(ownerId).stream().map(RestaurantResponse::from).collect(Collectors.toList());
    }

    @Override
    public RestaurantResponse assignManager(String id, String managerId, String callerId) {
        Restaurant r = repo.findById(id).orElseThrow(() -> new ApiException("Restaurant not found", HttpStatus.NOT_FOUND, "RESTAURANT_NOT_FOUND"));
        String role = httpServletRequest != null ? httpServletRequest.getHeader("X-User-Role") : null;
        boolean isAdmin = role != null && role.toUpperCase().contains("ADMIN");
        boolean isOwner = r.getOwnerId().equals(callerId);
        if (!isAdmin && !isOwner) {
            throw new ApiException("Only Restaurant Owners and Admins can assign managers", HttpStatus.FORBIDDEN, "FORBIDDEN");
        }
        if (r.getManagerIds() == null) {
            r.setManagerIds(new java.util.HashSet<>());
        }
        r.getManagerIds().add(managerId);
        Restaurant saved = repo.save(r);
        log.info("Manager {} assigned to restaurant {} by {}", managerId, id, callerId);
        return RestaurantResponse.from(saved);
    }

    @Override
    public RestaurantResponse unassignManager(String id, String managerId, String callerId) {
        Restaurant r = repo.findById(id).orElseThrow(() -> new ApiException("Restaurant not found", HttpStatus.NOT_FOUND, "RESTAURANT_NOT_FOUND"));
        String role = httpServletRequest != null ? httpServletRequest.getHeader("X-User-Role") : null;
        boolean isAdmin = role != null && role.toUpperCase().contains("ADMIN");
        boolean isOwner = r.getOwnerId().equals(callerId);
        if (!isAdmin && !isOwner) {
            throw new ApiException("Only Restaurant Owners and Admins can unassign managers", HttpStatus.FORBIDDEN, "FORBIDDEN");
        }
        if (r.getManagerIds() != null) {
            r.getManagerIds().remove(managerId);
        }
        Restaurant saved = repo.save(r);
        log.info("Manager {} unassigned from restaurant {} by {}", managerId, id, callerId);
        return RestaurantResponse.from(saved);
    }

    @Override
    public RestaurantResponse update(String id, String ownerId, RestaurantRequest req) {
        Restaurant r = getOwned(id, ownerId);
        if (req.getName() != null) r.setName(req.getName());
        if (req.getDescription() != null) r.setDescription(req.getDescription());
        if (req.getCuisineType() != null) r.setCuisineType(req.getCuisineType());
        if (req.getPhone() != null) r.setPhone(req.getPhone());
        if (req.getImageUrl() != null) r.setImageUrl(req.getImageUrl());
        return RestaurantResponse.from(repo.save(r));
    }

    @Override
    public RestaurantResponse toggleOpen(String id, String ownerId) {
        Restaurant r = getOwned(id, ownerId);
        r.setIsOpen(!r.getIsOpen());
        return RestaurantResponse.from(repo.save(r));
    }

    @Override
    public RestaurantResponse changeStatus(String id, Restaurant.RestaurantStatus status) {
        Restaurant r = repo.findById(id).orElseThrow(() -> new ApiException("Restaurant not found", HttpStatus.NOT_FOUND, "RESTAURANT_NOT_FOUND"));
        r.setStatus(status);
        if (status == Restaurant.RestaurantStatus.CLOSED || status == Restaurant.RestaurantStatus.SUSPENDED) {
            r.setIsOpen(false);
            r.setIsActive(false);
        } else if (status == Restaurant.RestaurantStatus.ACTIVE) {
            r.setIsActive(true);
        }
        return RestaurantResponse.from(repo.save(r));
    }

    @Override
    public void deleteRestaurant(String id) {
        Restaurant r = repo.findById(id).orElseThrow(() -> new ApiException("Restaurant not found", HttpStatus.NOT_FOUND, "RESTAURANT_NOT_FOUND"));
        r.setIsActive(false);
        r.setIsOpen(false);
        r.setStatus(Restaurant.RestaurantStatus.CLOSED);
        repo.save(r);
    }

    @Override
    public void updateRating(String restaurantId, double newRating) {
        Restaurant r = repo.findById(restaurantId).orElseThrow(() -> new ApiException("Restaurant not found", HttpStatus.NOT_FOUND, "RESTAURANT_NOT_FOUND"));
        double updated = (r.getRating() * r.getTotalRatings() + newRating) / (r.getTotalRatings() + 1);
        r.setRating(Math.round(updated * 10.0) / 10.0);
        r.setTotalRatings(r.getTotalRatings() + 1);
        repo.save(r);
    }

    private Restaurant getOwned(String id, String ownerId) {
        Restaurant r = repo.findById(id).orElseThrow(() -> new ApiException("Restaurant not found", HttpStatus.NOT_FOUND, "RESTAURANT_NOT_FOUND"));
        String role = httpServletRequest != null ? httpServletRequest.getHeader("X-User-Role") : null;
        boolean isAdmin = role != null && role.toUpperCase().contains("ADMIN");
        boolean isOwner = r.getOwnerId().equals(ownerId);
        boolean isAssignedManager = r.getManagerIds() != null && r.getManagerIds().contains(ownerId);
        if (!isAdmin && !isOwner && !isAssignedManager)
            throw new ApiException("You do not have management access for this restaurant", HttpStatus.FORBIDDEN, "NOT_OWNER");
        return r;
    }

    private LocalTime parse(String t) {
        if (t == null || t.isBlank()) return null;
        try { return LocalTime.parse(t); } catch (Exception e) { return null; }
    }
}
