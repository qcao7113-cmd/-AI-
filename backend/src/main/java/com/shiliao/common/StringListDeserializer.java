package com.shiliao.common;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;

import java.io.IOException;

/**
 * 兼容前端提交数组或逗号串两种情况：
 * ["甘","苦"]  →  "甘,苦"
 * "甘,苦"      →  "甘,苦"
 */
public class StringListDeserializer extends JsonDeserializer<String> {

    @Override
    public String deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        if (p.currentToken() == JsonToken.START_ARRAY) {
            StringBuilder sb = new StringBuilder();
            while (p.nextToken() != JsonToken.END_ARRAY) {
                if (sb.length() > 0) sb.append(',');
                sb.append(p.getText());
            }
            return sb.toString();
        }
        return p.getText();
    }
}
