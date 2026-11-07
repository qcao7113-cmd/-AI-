package com.shiliao.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.shiliao.common.StringListDeserializer;

import java.time.LocalDateTime;

/** 慢病食疗方案 */
@TableName("chronic_plan")
public class ChronicPlan {
    @TableId(type = IdType.INPUT)
    private String planKey;
    private String name;
    private String icon;
    private String color;
    private String summary;
    /** 食疗原则，换行分隔 */
    private String principles;
    /** 推荐食材，逗号分隔 */
    @JsonDeserialize(using = StringListDeserializer.class)
    private String recommended;
    /** 忌口，逗号分隔 */
    @JsonDeserialize(using = StringListDeserializer.class)
    private String avoid;
    private Integer users;
    private LocalDateTime updatedAt;

    public String getPlanKey() {
        return planKey;
    }

    public void setPlanKey(String planKey) {
        this.planKey = planKey;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getPrinciples() {
        return principles;
    }

    public void setPrinciples(String principles) {
        this.principles = principles;
    }

    public String getRecommended() {
        return recommended;
    }

    public void setRecommended(String recommended) {
        this.recommended = recommended;
    }

    public String getAvoid() {
        return avoid;
    }

    public void setAvoid(String avoid) {
        this.avoid = avoid;
    }

    public Integer getUsers() {
        return users;
    }

    public void setUsers(Integer users) {
        this.users = users;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
