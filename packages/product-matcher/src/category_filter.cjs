function getGlobalCategoryIds(candidate = {}) {
  const globalCategory =
    candidate?.global_category ??
    candidate?.globalCategory ??
    null;

  if (!globalCategory) {
    return [];
  }

  if (Array.isArray(globalCategory)) {
    return globalCategory
      .map(Number)
      .filter(Number.isFinite);
  }

  if (Array.isArray(globalCategory.catid)) {
    return globalCategory.catid
      .map(Number)
      .filter(Number.isFinite);
  }

  return [];
}

function categoryMatches(
  sourceProduct,
  candidate
) {
  const sourceCategory = Number(
    sourceProduct?.category_id
  );

  const candidateCategory = Number(
    candidate?.category_id
  );

  if (
    Number.isFinite(sourceCategory) &&
    Number.isFinite(candidateCategory) &&
    sourceCategory === candidateCategory
  ) {
    return true;
  }

  if (!Number.isFinite(sourceCategory)) {
    return true;
  }

  const globalIds =
    getGlobalCategoryIds(candidate);

  return globalIds.includes(
    sourceCategory
  );
}

module.exports = {
  getGlobalCategoryIds,
  categoryMatches,
};
