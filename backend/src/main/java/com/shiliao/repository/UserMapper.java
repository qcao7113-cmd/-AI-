package com.shiliao.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.shiliao.entity.User;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserMapper extends BaseMapper<User> {
}
