package com.slowspark.meta;

import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Public lists the app needs during profile setup: interests, prompts and Indian states. */
@RestController
@RequestMapping("/api/meta")
public class MetaController {

    public static final List<String> INDIAN_STATES = List.of(
            "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
            "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
            "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
            "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
            "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
            "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry");

    private final InterestRepository interests;
    private final PromptRepository prompts;

    public MetaController(InterestRepository interests, PromptRepository prompts) {
        this.interests = interests;
        this.prompts = prompts;
    }

    @GetMapping("/interests")
    public List<Interest> interests() {
        return interests.findAll(Sort.by("name"));
    }

    @GetMapping("/prompts")
    public List<Prompt> prompts() {
        return prompts.findAll(Sort.by("id"));
    }

    @GetMapping("/states")
    public List<String> states() {
        return INDIAN_STATES;
    }
}
