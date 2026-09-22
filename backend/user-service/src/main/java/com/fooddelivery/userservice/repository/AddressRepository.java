package com.fooddelivery.userservice.repository;

import com.fooddelivery.userservice.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AddressRepository extends JpaRepository<Address, String> {

    List<Address> findAllByUserProfileId(String userId);

    Optional<Address> findByIdAndUserProfileId(String id, String userId);

    Optional<Address> findByUserProfileIdAndIsDefaultTrue(String userId);

    @Modifying
    @Query("UPDATE Address a SET a.isDefault = false " +
           "WHERE a.userProfile.id = :userId")
    void clearDefaultForUser(@Param("userId") String userId);
}