// Authored fixture for checking the analysis environment, never a user target.
__attribute__((noinline)) int rea_fixture_score(int level, int bonus) {
  return level * 100 + bonus;
}

int main(void) {
  return rea_fixture_score(7, 25) == 725 ? 0 : 1;
}
