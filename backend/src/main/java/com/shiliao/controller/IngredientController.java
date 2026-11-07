package com.shiliao.controller;

import com.shiliao.common.R;
import com.shiliao.dto.Views;
import com.shiliao.entity.Ingredient;
import com.shiliao.security.AuthUser;
import com.shiliao.service.IngredientService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/** 食材库 */
@RestController
@RequestMapping("/api/ingredients")
public class IngredientController {

    public IngredientController(IngredientService service) {
        this.service = service;
    }

    private final IngredientService service;

    @GetMapping
    @PreAuthorize("hasAuthority('ingredient:view')")
    public R<R.PageResult<Views.IngredientView>> page(@RequestParam(defaultValue = "1") int page,
                                                      @RequestParam(defaultValue = "10") int pageSize,
                                                      @RequestParam(required = false) String keyword,
                                                      @RequestParam(required = false) String category,
                                                      @RequestParam(required = false) String status) {
        return R.ok(service.page(page, pageSize, keyword, category, status));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ingredient:manage')")
    public R<Views.IngredientView> save(@RequestBody Ingredient input, @AuthenticationPrincipal AuthUser user) {
        return R.ok(service.save(input, user));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ingredient:manage')")
    public R<Void> delete(@PathVariable String id, @AuthenticationPrincipal AuthUser user) {
        service.delete(id, user);
        return R.ok();
    }
}
