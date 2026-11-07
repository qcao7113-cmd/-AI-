package com.shiliao.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.shiliao.common.BizException;
import com.shiliao.common.Converters;
import com.shiliao.common.R;
import com.shiliao.dto.Views;
import com.shiliao.entity.Ingredient;
import com.shiliao.repository.IngredientMapper;
import com.shiliao.security.AuthUser;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/** 食材库 */
@Service
public class IngredientService {

    public IngredientService(IngredientMapper mapper, AuthService authService) {
        this.mapper = mapper;
        this.authService = authService;
    }

    private final IngredientMapper mapper;
    private final AuthService authService;

    public R.PageResult<Views.IngredientView> page(int page, int pageSize, String keyword, String category, String status) {
        LambdaQueryWrapper<Ingredient> qw = new LambdaQueryWrapper<Ingredient>()
                .eq(category != null && !category.isBlank(), Ingredient::getCategory, category)
                .eq(status != null && !status.isBlank(), Ingredient::getStatus, status)
                .and(keyword != null && !keyword.isBlank(), w -> w
                        .like(Ingredient::getName, keyword)
                        .or().like(Ingredient::getEfficacy, keyword)
                        .or().like(Ingredient::getMeridian, keyword))
                .orderByAsc(Ingredient::getName);
        Page<Ingredient> p = mapper.selectPage(new Page<>(page, pageSize), qw);
        List<Views.IngredientView> items = p.getRecords().stream().map(this::toView).toList();
        return R.PageResult.of(items, p.getTotal(), page, pageSize);
    }

    public Views.IngredientView save(Ingredient input, AuthUser operator) {
        input.setFlavor(Converters.join(splitFlavor(input.getFlavor())));
        int stock = input.getStock() == null ? 0 : input.getStock();
        input.setStatus(stock == 0 ? "off" : stock < 10 ? "low" : "available");
        input.setUpdatedAt(LocalDateTime.now());
        if (input.getId() == null || input.getId().isBlank()) {
            input.setId(null);
            mapper.insert(input);
            authService.log(operator.getName(), "create", "食材「" + input.getName() + "」", "新增" + input.getCategory() + "食材", "success");
        } else {
            mapper.updateById(input);
            authService.log(operator.getName(), "update", "食材「" + input.getName() + "」", "更新食材属性：" + input.getNature() + "性", "success");
        }
        return toView(mapper.selectById(input.getId()));
    }

    public void delete(String id, AuthUser operator) {
        Ingredient db = mapper.selectById(id);
        if (db == null) throw new BizException(404, "食材不存在");
        mapper.deleteById(id);
        authService.log(operator.getName(), "delete", "食材「" + db.getName() + "」", "删除食材", "success");
    }

    private List<String> splitFlavor(String s) {
        if (s == null) return List.of();
        return java.util.Arrays.stream(s.split("[,，、\\s]+")).map(String::trim).filter(x -> !x.isEmpty()).toList();
    }

    private Views.IngredientView toView(Ingredient i) {
        return new Views.IngredientView(i.getId(), i.getName(), i.getCategory(), i.getNature(),
                Converters.split(i.getFlavor()), i.getMeridian(), i.getEfficacy(), i.getCalorie(),
                i.getUnit(), i.getStock(), i.getStatus(), Converters.ts(i.getUpdatedAt()));
    }
}
