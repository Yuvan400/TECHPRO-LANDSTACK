package com.landstack.repository;

import com.landstack.entity.Department;
import com.landstack.entity.Role;
import com.landstack.entity.RoleType;
import com.landstack.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Boolean existsByEmail(String email);
    List<User> findByRoleName(RoleType roleName);
    List<User> findByDepartmentAndRoleName(Department department, RoleType roleName);
    List<User> findByDepartmentId(Long departmentId);
}
