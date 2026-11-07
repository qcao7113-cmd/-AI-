package com.shiliao.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.shiliao.common.BizException;
import com.shiliao.common.Converters;
import com.shiliao.common.R;
import com.shiliao.dto.Views;
import com.shiliao.entity.Recipe;
import com.shiliao.repository.RecipeMapper;
import com.shiliao.security.AuthUser;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/** 药膳食谱 */
@Service
public class RecipeService {

    public RecipeService(RecipeMapper mapper, AuthService authService) {
        this.mapper = mapper;
        this.authService = authService;
    }

    private final RecipeMapper mapper;
    private final AuthService authService;

    public R.PageResult<Views.RecipeView> page(int page, int pageSize, String keyword, String category, String status) {
        LambdaQueryWrapper<Recipe> qw = new LambdaQueryWrapper<Recipe>()
                .eq(category != null && !category.isBlank(), Recipe::getCategory, category)
                .eq(status != null && !status.isBlank(), Recipe::getStatus, status)
                .and(keyword != null && !keyword.isBlank(), w -> w
                        .like(Recipe::getName, keyword)
                        .or().like(Recipe::getEffect, keyword)
                        .or().like(Recipe::getSuitedChronic, keyword)
                        .or().like(Recipe::getSuitedConstitution, keyword))
                .orderByDesc(Recipe::getViews);
        Page<Recipe> p = mapper.selectPage(new Page<>(page, pageSize), qw);
        List<Views.RecipeView> items = p.getRecords().stream().map(this::toView).toList();
        return R.PageResult.of(items, p.getTotal(), page, pageSize);
    }

    public Views.RecipeView save(Recipe input, AuthUser operator) {
        input.setUpdatedAt(LocalDateTime.now());
        if (input.getIngredients() == null) input.setIngredients("[]");
        if (input.getId() == null || input.getId().isBlank()) {
            input.setId(null);
            if (input.getViews() == null) input.setViews(0);
            if (input.getFavorites() == null) input.setFavorites(0);
            mapper.insert(input);
            authService.log(operator.getName(), "create", "食谱「" + input.getName() + "」", "新增" + input.getCategory() + "食谱", "success");
        } else {
            mapper.updateById(input);
            authService.log(operator.getName(), "update", "食谱「" + input.getName() + "」", "更新食谱信息", "success");
        }
        return toView(mapper.selectById(input.getId()));
    }

    public void delete(String id, AuthUser operator) {
        Recipe db = mapper.selectById(id);
        if (db == null) throw new BizException(404, "食谱不存在");
        mapper.deleteById(id);
        authService.log(operator.getName(), "delete", "食谱「" + db.getName() + "」", "删除食谱", "success");
    }

    private Views.RecipeView toView(Recipe r) {
        return new Views.RecipeView(r.getId(), r.getName(), r.getCategory(),
                Converters.split(r.getSuitedConstitution()), Converters.split(r.getSuitedChronic()),
                Converters.parseIngredients(r.getIngredients()), r.getEffect(), r.getCalories(),
                r.getCookTime(), r.getStatus(), r.getCover(), r.getViews(), r.getFavorites(),
                Converters.ts(r.getUpdatedAt()));
    }
}
