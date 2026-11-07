package com.shiliao.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.shiliao.entity.Ingredient;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface IngredientMapper extends BaseMapper<Ingredient> {
}
