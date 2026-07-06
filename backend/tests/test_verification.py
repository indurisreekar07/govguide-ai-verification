import pytest
import datetime
from app.services.verification import levenshtein_ratio

def test_levenshtein_ratio_exact_match():
    assert levenshtein_ratio("Dhanush Kumar", "Dhanush Kumar") == 1.0
    assert levenshtein_ratio("Dhanush Kumar", "dhanush kumar") == 1.0  # Casing check
    assert levenshtein_ratio("  Dhanush Kumar  ", "dhanush kumar") == 1.0  # Whitespace check

def test_levenshtein_ratio_near_match():
    # Fuzzy match should be high
    score = levenshtein_ratio("Dhanush Kumar", "Dhanush K.")
    assert score > 0.70
    
    score2 = levenshtein_ratio("Dhanush Kumar", "Dhanus Kumar")
    assert score2 > 0.90

def test_levenshtein_ratio_mismatch():
    # Completely different names should have low score
    score = levenshtein_ratio("Dhanush Kumar", "John Doe")
    assert score < 0.30

def test_levenshtein_ratio_empty():
    assert levenshtein_ratio("", "Dhanush") == 0.0
    assert levenshtein_ratio("Dhanush", "") == 0.0
