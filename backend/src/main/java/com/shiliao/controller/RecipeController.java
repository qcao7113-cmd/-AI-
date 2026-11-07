package com.shiliao.controller;

import com.shiliao.common.R;
import com.shiliao.dto.Views;
import com.shiliao.entity.Recipe;
import com.shiliao.security.AuthUser;
import com.shiliao.service.RecipeService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/** 药膳食谱 */
@RestController
@RequestMapping("/api/recipes")
public class RecipeController {

    public RecipeController(RecipeService service) {
        this.service = service;
    }

    private final RecipeService service;

    @GetMapping
    @PreAuthorize("hasAuthority('recipe:view')")
    public R<R.PageResult<Views.RecipeView>> page(@RequestParam(defaultValue = "1") int page,
                                                  @RequestParam(defaultValue = "9") int pageSize,
                                                  @RequestParam(required = false) String keyword,
                                                  @RequestParam(required = false) String category,
                                                  @RequestParam(required = false) String status) {
        return R.ok(service.page(page, pageSize, keyword, category, status));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('recipe:manage')")
    public R<Views.RecipeView> save(@RequestBody Recipe input, @AuthenticationPrincipal AuthUser user) {
        return R.ok(service.save(input, user));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('recipe:manage')")
    public R<Void> delete(@PathVariable String id, @AuthenticationPrincipal AuthUser user) {
        service.delete(id, user);
        return R.ok();
    }
}
