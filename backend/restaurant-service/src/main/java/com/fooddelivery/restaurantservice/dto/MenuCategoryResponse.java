package com.fooddelivery.restaurantservice.dto;

import com.fooddelivery.restaurantservice.entity.MenuCategory;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import java.util.List;
import java.util.stream.Collectors;

@Data @Builder
@NoArgsConstructor @AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MenuCategoryResponse {

    private String id;
    private String name;
    private String description;
    private Integer displayOrder;
    private Boolean isActive;
    private List<MenuItemResponse> items;

    public static MenuCategoryResponse from(MenuCategory c,
                                             boolean includeItems) {
        MenuCategoryResponse r = MenuCategoryResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .description(c.getDescription())
                .displayOrder(c.getDisplayOrder())
                .isActive(c.getIsActive())
                .build();

        if (includeItems && c.getItems() != null) {
            r.setItems(c.getItems().stream()
                    .filter(i -> i.getIsAvailable())
                    .map(MenuItemResponse::from)
                    .collect(Collectors.toList()));
        }
        return r;
    }
}