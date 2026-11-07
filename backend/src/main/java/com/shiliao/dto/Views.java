package com.shiliao.dto;

import java.util.List;

/** 前端实体视图：把逗号分隔字段转换为数组，方便直接绑定 */
public final class Views {

    private Views() {
    }

    public record RoleView(String id, String roleKey, String name, String description,
                           List<String> permissions, boolean builtin, String createdAt) {
    }

    public record UserView(String id, String username, String name, String phone, String email,
                           String gender, Integer age, String constitution, List<String> chronicTags,
                           String roleKey, String status, String avatarColor,
                           String createdAt, String lastLoginAt) {
    }

    public record IngredientView(String id, String name, String category, String nature,
                                 List<String> flavor, String meridian, String efficacy,
                                 Integer calorie, String unit, Integer stock, String status, String updatedAt) {
    }

    public record RecipeIngredient(String name, String amount) {
    }

    public record RecipeView(String id, String name, String category, List<String> suitedConstitution,
                             List<String> suitedChronic, List<RecipeIngredient> ingredients, String effect,
                             Integer calories, Integer cookTime, String status, String cover,
                             Integer views, Integer favorites, String updatedAt) {
    }

    public record ChronicPlanView(String key, String name, String icon, String color, String summary,
                                  List<String> principles, List<String> recommended, List<String> avoid,
                                  Integer users, String updatedAt) {
    }

    public record HealthRow(String userId, String customer, Double height, Double weight,
                            Double bloodSugar, Integer uricAcid, Integer systolic, Integer diastolic,
                            String updatedAt, double bmi, String flag) {
    }
}
