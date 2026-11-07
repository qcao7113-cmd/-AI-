package com.shiliao.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.shiliao.common.StringListDeserializer;

import java.time.LocalDateTime;

/** 药膳食谱 */
@TableName("recipe")
public class Recipe {
    @TableId(type = IdType.ASSIGN_ID)
    private String id;
    private String name;
    private String category;
    /** 适用体质，逗号分隔 */
    @JsonDeserialize(using = StringListDeserializer.class)
    private String suitedConstitution;
    /** 适用慢病，逗号分隔 */
    @JsonDeserialize(using = StringListDeserializer.class)
    private String suitedChronic;
    /** 食材配比，JSON 字符串 [{name,amount}] */
    private String ingredients;
    private String effect;
    private Integer calories;
    private Integer cookTime;
    /** published / draft / offline */
    private String status;
    private String cover;
    private Integer views;
    private Integer favorites;
    private LocalDateTime updatedAt;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getSuitedConstitution() {
        return suitedConstitution;
    }

    public void setSuitedConstitution(String suitedConstitution) {
        this.suitedConstitution = suitedConstitution;
    }

    public String getSuitedChronic() {
        return suitedChronic;
    }

    public void setSuitedChronic(String suitedChronic) {
        this.suitedChronic = suitedChronic;
    }

    public String getIngredients() {
        return ingredients;
    }

    public void setIngredients(String ingredients) {
        this.ingredients = ingredients;
    }

    public String getEffect() {
        return effect;
    }

    public void setEffect(String effect) {
        this.effect = effect;
    }

    public Integer getCalories() {
        return calories;
    }

    public void setCalories(Integer calories) {
        this.calories = calories;
    }

    public Integer getCookTime() {
        return cookTime;
    }

    public void setCookTime(Integer cookTime) {
        this.cookTime = cookTime;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCover() {
        return cover;
    }

    public void setCover(String cover) {
        this.cover = cover;
    }

    public Integer getViews() {
        return views;
    }

    public void setViews(Integer views) {
        this.views = views;
    }

    public Integer getFavorites() {
        return favorites;
    }

    public void setFavorites(Integer favorites) {
        this.favorites = favorites;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
