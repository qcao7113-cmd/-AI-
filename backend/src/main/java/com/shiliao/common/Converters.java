package com.shiliao.common;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shiliao.dto.Views;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/** 实体字段转换工具：逗号串 ↔ List、时间格式化 */
public final class Converters {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private Converters() {
    }

    public static List<String> split(String s) {
        if (s == null || s.isBlank()) return Collections.emptyList();
        return Arrays.stream(s.split(",")).map(String::trim).filter(x -> !x.isEmpty()).toList();
    }

    public static String join(List<String> list) {
        return list == null ? "" : String.join(",", list);
    }

    public static String ts(LocalDateTime t) {
        return t == null ? null : t.format(ISO);
    }

    public static List<Views.RecipeIngredient> parseIngredients(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return MAPPER.readValue(json, new TypeReference<List<Views.RecipeIngredient>>() {
            });
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    public static String writeIngredients(List<Views.RecipeIngredient> list) {
        if (list == null) return "[]";
        try {
            return MAPPER.writeValueAsString(list);
        } catch (Exception e) {
            return "[]";
        }
    }

    public static String now() {
        return LocalDateTime.now().format(FMT);
    }
}
