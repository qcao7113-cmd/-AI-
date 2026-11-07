package com.shiliao.controller;

import com.shiliao.common.R;
import com.shiliao.dto.Views;
import com.shiliao.entity.User;
import com.shiliao.security.AuthUser;
import com.shiliao.service.UserService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/** 用户管理 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    public UserController(UserService userService) {
        this.userService = userService;
    }

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasAuthority('user:view')")
    public R<R.PageResult<Views.UserView>> page(@RequestParam(defaultValue = "1") int page,
                                                @RequestParam(defaultValue = "10") int pageSize,
                                                @RequestParam(required = false) String keyword,
                                                @RequestParam(required = false) String roleKey,
                                                @RequestParam(required = false) String status) {
        return R.ok(userService.page(page, pageSize, keyword, roleKey, status));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('user:manage')")
    public R<Views.UserView> create(@RequestBody User input, @AuthenticationPrincipal AuthUser user) {
        return R.ok(userService.create(input, user));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('user:manage')")
    public R<Views.UserView> update(@PathVariable String id, @RequestBody User input,
                                    @AuthenticationPrincipal AuthUser user) {
        return R.ok(userService.update(id, input, user));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('user:manage')")
    public R<Void> delete(@PathVariable String id, @AuthenticationPrincipal AuthUser user) {
        userService.delete(id, user);
        return R.ok();
    }
}
